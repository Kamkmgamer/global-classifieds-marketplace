"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast"; // Import useToast

export default function PostPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast(); // Initialize useToast

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        title: String(formData.get("title") || "").trim(),
        price: Number.parseInt(String(formData.get("price") || "0"), 10) || 0,
        image: String(formData.get("image") || "").trim() || undefined,
        location: String(formData.get("location") || "").trim() || undefined,
        description: String(formData.get("description") || "").trim() || undefined,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/listings`, { // Corrected URL
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to create listing");
      }
      toast({ // Show success toast
        title: "Listing created!",
        description: "Your listing has been successfully posted.",
      });
      router.push("/browse");
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      toast({ // Show error toast
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Post a Listing</h1>
      <p className="mt-2 text-muted-foreground">Create a new listing with title, price, location, and optional image.</p>
      <Card className="mt-6">
        <CardContent>
          <form
            className="mt-4 grid grid-cols-1 gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget as HTMLFormElement);
              void onSubmit(fd);
            }}
          >
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <Input id="title" name="title" placeholder="Vintage road bike" required  />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="price" className="text-sm font-medium">Price (USD)</label>
                <Input id="price" name="price" inputMode="numeric" pattern="[0-9]*" placeholder="250" required  />
              </div>
              <div className="grid gap-2">
                <label htmlFor="location" className="text-sm font-medium">Location</label>
                <Input id="location" name="location" placeholder="Berlin"  />
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="image" className="text-sm font-medium">Image URL</label>
              <Input id="image" name="image" type="url" placeholder="https://..."  />
            </div>

            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <textarea
                id="description"
                name="description"
                rows={5}
                className="h-auto w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Add details about condition, accessories, etc."
              />
            </div>

            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}

            <div className="flex items-center gap-3">
              <Button disabled={loading} className="px-6">
                {loading ? "Posting..." : "Post Listing"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
