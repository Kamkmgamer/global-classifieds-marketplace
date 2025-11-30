import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

export const ourFileRouter = {
  // Define FileRoute for listing images
  imageUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  }).onUploadComplete(async ({ file }) => {
    console.log('Upload complete for file:', file.url);
    return { uploadedBy: 'user' };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
