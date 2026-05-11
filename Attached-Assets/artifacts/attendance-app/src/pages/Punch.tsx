import React, { useRef, useState, useEffect, useCallback } from "react";
import { useGetTodayAttendance, usePunchIn, usePunchOut, getGetTodayAttendanceQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, MapPin, Loader2, CheckCircle2, RefreshCw, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Punch() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: today, isLoading: loadingToday } = useGetTodayAttendance();
  const punchIn = usePunchIn();
  const punchOut = usePunchOut();

  const record = today?.record;
  const isPunchedIn = record && !record.punchOutTime;
  const isPunchedOut = record && record.punchOutTime;

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access and try again."
          : "Could not start camera. Make sure no other app is using it."
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  useEffect(() => {
    if (!isPunchedOut) {
      startCamera();
    }
    return () => stopCamera();
  }, [isPunchedOut]);

  const handleVideoCanPlay = () => {
    setCameraReady(true);
    videoRef.current?.play().catch(() => {});
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Cap at 480px wide to stay well under proxy limits (~30-50KB)
    const MAX_WIDTH = 480;
    const aspectRatio = (video.videoHeight || 480) / (video.videoWidth || 640);
    canvas.width = Math.min(video.videoWidth || 640, MAX_WIDTH);
    canvas.height = Math.round(canvas.width * aspectRatio);

    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Mirror horizontally so the captured image is not reversed
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      // Quality 0.7 keeps faces clear while staying small
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      setSelfieBase64(dataUrl);
    }
  };

  const retakeSelfie = () => {
    setSelfieBase64(null);
  };

  const getLocation = (): Promise<{ lat: number; lng: number }> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationLoading(false);
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(loc);
          resolve(loc);
        },
        (err) => {
          setLocationLoading(false);
          reject(new Error("Location access denied. Please allow GPS and try again."));
        },
        { timeout: 10000 }
      );
    });

  const handlePunchIn = async () => {
    if (!selfieBase64) {
      toast({ title: "Selfie required", description: "Capture your photo before punching in.", variant: "destructive" });
      return;
    }
    try {
      const loc = await getLocation();
      punchIn.mutate(
        { data: { selfieBase64, latitude: loc.lat, longitude: loc.lng } },
        {
          onSuccess: () => {
            toast({ title: "Punched in successfully!", description: `At ${format(new Date(), "HH:mm")}` });
            queryClient.invalidateQueries({ queryKey: getGetTodayAttendanceQueryKey() });
            setSelfieBase64(null);
          },
          onError: (e: any) => {
            toast({ title: "Failed to punch in", description: e?.message, variant: "destructive" });
          },
        }
      );
    } catch (err: any) {
      toast({ title: "Location error", description: err.message, variant: "destructive" });
    }
  };

  const handlePunchOut = async () => {
    try {
      const loc = await getLocation();
      punchOut.mutate(
        { data: { latitude: loc.lat, longitude: loc.lng, selfieBase64: selfieBase64 || null } },
        {
          onSuccess: () => {
            toast({ title: "Punched out successfully!", description: `At ${format(new Date(), "HH:mm")}` });
            queryClient.invalidateQueries({ queryKey: getGetTodayAttendanceQueryKey() });
            setSelfieBase64(null);
            stopCamera();
          },
          onError: () => {
            toast({ title: "Failed to punch out", variant: "destructive" });
          },
        }
      );
    } catch (err: any) {
      toast({ title: "Location error", description: err.message, variant: "destructive" });
    }
  };

  if (loadingToday) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading attendance status…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Punch In / Out</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>
        <Badge
          className={
            isPunchedOut
              ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
              : isPunchedIn
              ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
              : "bg-muted text-muted-foreground"
          }
          variant="outline"
        >
          {isPunchedOut ? "✓ Shift Completed" : isPunchedIn ? "● Active" : "Not Started"}
        </Badge>
      </div>

      {record && (
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Punch In</p>
                <p className="text-lg font-bold text-foreground">
                  {record.punchInTime ? format(new Date(record.punchInTime), "HH:mm") : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Punch Out</p>
                <p className="text-lg font-bold text-foreground">
                  {record.punchOutTime ? format(new Date(record.punchOutTime), "HH:mm") : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Hours</p>
                <p className="text-lg font-bold text-foreground">
                  {record.workingHours ? `${record.workingHours.toFixed(1)}h` : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isPunchedOut && (
        <Card className="overflow-hidden border-border bg-card">
          <CardHeader className="bg-muted/50 border-b border-border px-5 py-4">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              Live Selfie Capture
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              {selfieBase64
                ? "Photo captured — looks good! Retake if needed."
                : "Position your face in the frame and capture a clear photo."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full max-w-xs bg-black rounded-xl overflow-hidden shadow-lg" style={{ aspectRatio: "4/3" }}>
                {!selfieBase64 ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      onCanPlay={handleVideoCanPlay}
                      className="w-full h-full object-cover"
                      style={{ transform: "scaleX(-1)", display: cameraError ? "none" : "block" }}
                    />
                    {!cameraReady && !cameraError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <p className="text-sm">Starting camera…</p>
                      </div>
                    )}
                    {cameraError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 text-white gap-3 p-4 text-center">
                        <Camera className="w-8 h-8 text-red-400 opacity-60" />
                        <p className="text-sm text-red-300 leading-snug">{cameraError}</p>
                        <Button size="sm" variant="outline" onClick={startCamera} className="text-white border-white/30 hover:bg-white/10">
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
                        </Button>
                      </div>
                    )}
                    {cameraReady && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-4 border-2 border-white/40 rounded-lg" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-white/30" />
                      </div>
                    )}
                  </>
                ) : (
                  <img src={selfieBase64} alt="Captured selfie" className="w-full h-full object-cover" />
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="flex gap-3">
                {!selfieBase64 ? (
                  <Button
                    onClick={captureSelfie}
                    disabled={!cameraReady || !!cameraError}
                    size="lg"
                    className="px-8 font-semibold"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Capture Photo
                  </Button>
                ) : (
                  <Button onClick={retakeSelfie} variant="outline" size="lg" className="px-8 font-semibold">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retake
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">GPS Location</p>
                {location ? (
                  <p className="text-xs text-muted-foreground font-mono">
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Will be captured on punch</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              {!isPunchedIn && !isPunchedOut && (
                <Button
                  onClick={handlePunchIn}
                  disabled={punchIn.isPending || locationLoading || !selfieBase64}
                  size="lg"
                  className="w-full sm:w-36 bg-green-600 hover:bg-green-700 text-white font-bold shadow-sm"
                >
                  {punchIn.isPending || locationLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Punch In
                    </>
                  )}
                </Button>
              )}

              {isPunchedIn && !isPunchedOut && (
                <Button
                  onClick={handlePunchOut}
                  disabled={punchOut.isPending || locationLoading}
                  size="lg"
                  variant="destructive"
                  className="w-full sm:w-36 font-bold shadow-sm"
                >
                  {punchOut.isPending || locationLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Punch Out
                    </>
                  )}
                </Button>
              )}

              {isPunchedOut && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                  <CheckCircle2 className="w-5 h-5" />
                  Shift Completed
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
