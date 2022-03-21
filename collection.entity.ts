import { ObjectId } from 'mongodb';

export interface CollectionEntity {
  _id: ObjectId;
  id: string;
  '@type': string;
  changes: object;
  collection: {
    '@type': string;
    label: string;
    listings: { id: string }[];
    description: string;
    collaborator?: {
      userId?: string;
      email: string;
      status: string;
    };
  };
  created: {
    '@type': string;
    ms: number;
    ordinal: number;
  };
  foreignKey: string;
  ownership: {
    primary: string;
    secondary: string[];
  };
}
