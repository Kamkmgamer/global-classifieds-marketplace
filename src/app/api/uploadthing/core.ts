import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { auth } from '@clerk/nextjs/server';

const f = createUploadthing();

export const ourFileRouter = {
  // Define FileRoute for listing images
  imageUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new Error('Unauthorized');

      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for file:', file.url);
      console.log('Uploaded by user:', metadata.userId);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
