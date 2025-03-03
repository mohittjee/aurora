import { NextRequest as OriginalNextRequest } from "next/server";

declare module "next/server" {
  interface NextRequest extends OriginalNextRequest {
    session?: {
      user?: {
        id: string;
        email: string;
        name: string | null;
      };
    };
  }
}