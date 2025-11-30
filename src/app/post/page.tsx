'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/http';
import { UploadButton } from '@/lib/uploadthing';
import Image from 'next/image';
import '@uploadthing/react/styles.css';

export default function PostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [imageUrl, setImageUrl] = React.useState<string>('');

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        title: String(formData.get('title') || '').trim(),
        price: Number.parseInt(String(formData.get('price') || '0'), 10) || 0,
        image: imageUrl || undefined,
        location: String(formData.get('location') || '').trim() || undefined,
        description: String(formData.get('description') || '').trim() || undefined,
      };

      await api.post('/listings', payload);
      toast({
        title: 'Listing created!',
        description: 'Your listing has been successfully posted.',
      });
      router.push('/browse');
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      setError(msg);
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Post a Listing</h1>
      <p className="mt-2 text-muted-foreground">
        Create a new listing with title, price, location, and optional image.
      </p>
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
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input id="title" name="title" placeholder="Vintage road bike" required />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="price" className="text-sm font-medium">
                  Price (USD)
                </label>
                <Input
                  id="price"
                  name="price"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="250"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Location
                </label>
                <Input id="location" name="location" placeholder="Berlin" />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Image</label>
              <div className="flex flex-col gap-3">
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={(res) => {
                    if (res && res[0]) {
                      setImageUrl(res[0].url);
                      toast({
                        title: 'Upload complete!',
                        description: 'Your image has been uploaded successfully.',
                      });
                    }
                  }}
                  onUploadError={(error: Error) => {
                    toast({
                      title: 'Upload failed',
                      description: error.message,
                      variant: 'destructive',
                    });
                  }}
                />
                {imageUrl && (
                  <div className="relative h-48 w-full overflow-hidden rounded-md border">
                    <Image src={imageUrl} alt="Uploaded preview" fill className="object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                className="border-input focus-visible:ring-ring flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                placeholder="Add details about condition, accessories, etc."
              />
            </div>

            {error && <div className="text-destructive text-sm">{error}</div>}

            <div className="flex items-center gap-3">
              <Button disabled={loading} className="px-6">
                {loading ? 'Posting...' : 'Post Listing'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
