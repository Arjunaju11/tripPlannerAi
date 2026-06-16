import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { CheckCircle2, FileText, Loader2, UploadCloud, XCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import type { ApiResponse, ItineraryDto } from "@trip-planner/shared";
import { Badge, Button, Card } from "../components/ui";
import { useToast } from "../components/toast";
import { api } from "../lib/api";

function getUploadErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiResponse<null>>(error)) {
    return error.response?.data?.message ?? "Upload failed";
  }
  return "Upload failed";
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function UploadPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return (await api.post<ApiResponse<ItineraryDto>>("/upload", form, { headers: { "Content-Type": "multipart/form-data" } })).data.data;
    },
    onSuccess: (itinerary) => {
      toast({ type: "success", title: "Itinerary generated", message: "Your travel document was processed successfully." });
      navigate(`/itinerary/${itinerary.id}`);
    },
    onError: (error) => toast({ type: "error", title: "Upload failed", message: getUploadErrorMessage(error) })
  });
  const { getRootProps, getInputProps, acceptedFiles, fileRejections, isDragActive, isDragReject } = useDropzone({
    maxSize: 10 * 1024 * 1024,
    accept: { "application/pdf": [".pdf"], "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    multiple: false,
    disabled: mutation.isPending,
    onDrop: (files) => {
      if (files[0]) {
        toast({ type: "info", title: "Generating itinerary", message: "Extracting booking details and recommendations." });
        mutation.mutate(files[0]);
      }
    }
  });

  const selected = acceptedFiles[0];
  const rejection = fileRejections[0]?.errors[0]?.message;

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        <Badge>Document to itinerary</Badge>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Upload travel booking details</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">Drop a flight ticket, hotel booking, train ticket, or travel screenshot. The app extracts booking facts and generates a shareable itinerary.</p>
      </div>

      <Card className="p-0">
        <div
          {...getRootProps()}
          className={[
            "m-4 flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition duration-200",
            isDragActive ? "scale-[1.01] border-primary bg-primary/10" : "border-border bg-muted/50 hover:border-primary/60 hover:bg-primary/5",
            isDragReject ? "border-red-400 bg-red-50" : "",
            mutation.isPending ? "cursor-wait opacity-80" : ""
          ].join(" ")}
        >
          <input {...getInputProps()} />
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            {mutation.isPending ? <Loader2 className="h-8 w-8 animate-spin" /> : <UploadCloud className="h-8 w-8" />}
          </div>
          <h2 className="mt-5 text-xl font-semibold">{isDragActive ? "Drop the document here" : "Drag a PDF or image here"}</h2>
          <p className="mt-2 text-sm text-slate-500">PDF, PNG, JPG, or JPEG up to 10MB</p>
          <Button type="button" className="mt-5" disabled={mutation.isPending}>Choose file</Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {["Validate file", "Extract booking text", "Generate recommendations"].map((step, index) => (
          <Card key={step} className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">{mutation.isPending && index === 1 ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}</div>
            <p className="text-sm font-medium">{step}</p>
          </Card>
        ))}
      </div>

      {selected && (
        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <FileText className="h-8 w-8 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate font-semibold">{selected.name}</p>
              <p className="text-sm text-slate-500">{formatBytes(selected.size)}</p>
            </div>
          </div>
          {mutation.isPending && <p className="text-sm font-medium text-primary">Extracting and generating...</p>}
        </Card>
      )}

      {(rejection || mutation.isError) && (
        <Card className="border-red-200 bg-red-50 text-red-700">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{rejection ?? getUploadErrorMessage(mutation.error)}</p>
          </div>
        </Card>
      )}
    </section>
  );
}
