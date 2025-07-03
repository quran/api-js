import { TranslatedName } from "./TranslatedName";

export interface Reciter {
  id: number;
  name: string;
  profile_picture?: string;
  cover_image?: string;
  bio?: string;
  qirat: {
    language_name: string;
    name: string;
  };
  style: {
    language_name: string;
    name: string;
  };
  translated_name: TranslatedName
}
