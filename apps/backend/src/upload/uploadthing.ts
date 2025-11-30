import { createUploadthing, type FileRouter } from 'uploadthing/express';

const f = createUploadthing();

export const uploadRouter = {
  // Define FileRoute for listing images
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  }).onUploadComplete((data) => {
    console.log('Upload completed:', data);
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
