import { Controller, All, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { createRouteHandler } from 'uploadthing/express';
import { uploadRouter } from './uploadthing';

@Controller('api/uploadthing')
export class UploadController {
  private routeHandler = createRouteHandler({
    router: uploadRouter,
  });

  @All('*')
  async handleUpload(@Req() req: Request, @Res() res: Response) {
    return this.routeHandler(req, res);
  }
}
