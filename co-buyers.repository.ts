import { Inject, Injectable } from '@nestjs/common';
import { Collection, ObjectId } from 'mongodb';
import { CollectionEntity } from '../common/interfaces/collection.entity';
import { COLLECTION_TOKEN } from '../shared/database/mongo/mongo.module';

@Injectable()
export class CoBuyersRepository {
  constructor(
    @Inject(COLLECTION_TOKEN)
    private collection: Collection<CollectionEntity>,
  ) {}

  agentCollectionsForUser(userId: string): Promise<CollectionEntity[]> {
    const cursor = this.collection.find({
      'ownership.primary': { $regex: /^UPA/ },
      'ownership.secondary': userId,
    });

    return cursor.toArray();
  }

  sharedCommandCollections(
    userId: string,
    foreignKeys: string[],
  ): Promise<Pick<CollectionEntity, 'id' | 'ownership' | '_id'>[]> {
    return this.collection
      .find({
        'ownership.secondary': userId,
        $or: foreignKeys.map((foreignKey) => ({ foreignKey })),
      })
      .project<Pick<CollectionEntity, 'id' | 'ownership' | '_id'>>({
        id: 1,
        ownership: 1,
        _id: 1,
      })
      .toArray();
  }

  async removeCoBuyerByCollectionIds(
    collectionIds: ObjectId[],
    coBuyerId: string,
  ): Promise<void> {
    await this.collection.updateMany(
      { _id: { $in: collectionIds } },
      { $pull: { 'ownership.secondary': coBuyerId } },
    );
  }

  async deleteCollectionsByIds(collectionIds: ObjectId[]): Promise<void> {
    await this.collection.deleteMany({ _id: { $in: collectionIds } });
  }

  async addCoBuyer(userId: string, coBuyerId: string): Promise<void> {
    await this.collection.updateMany(
      {
        $or: [
          { 'ownership.primary': userId },
          {
            $and: [
              { 'ownership.primary': { $regex: /^UPA/ } },
              { 'ownership.secondary': userId },
            ],
          },
        ],
      },
      {
        $addToSet: { 'ownership.secondary': coBuyerId },
        $pull: { 'collection.collaborators': { userId: coBuyerId } },
      },
    );
  }

  sharedSingleAgentCollections(
    userId: string,
    coBuyerId: string,
  ): Promise<CollectionEntity[]> {
    const cursor = this.collection.find({
      $and: [
        { 'ownership.primary': { $regex: /^UPA/ } },
        { 'ownership.secondary': userId },
        { 'ownership.secondary': coBuyerId },
      ],
    });
    return cursor.toArray();
  }

  async insertMany(
    collections: Omit<CollectionEntity, '_id'>[],
  ): Promise<void> {
    await this.collection.insertMany(collections);
  }

  async removeCoBuyerFromAgentCollection(
    userId: string,
    coBuyerId: string,
  ): Promise<void> {
    await this.collection.updateMany(
      {
        $and: [
          { 'ownership.primary': { $regex: /^UPA/ } },
          { 'ownership.secondary': userId },
          { 'ownership.secondary': coBuyerId },
        ],
      },
      { $pull: { 'ownership.secondary': coBuyerId } },
    );
  }

  async removeCoBuyer(userId: string, coBuyerId: string): Promise<void> {
    await this.collection.updateMany(
      {
        $or: [
          { 'ownership.primary': userId },
          {
            $and: [
              { 'ownership.primary': { $regex: /^UPA/ } },
              { 'ownership.secondary': userId },
            ],
          },
        ],
      },
      { $pull: { 'ownership.secondary': coBuyerId } },
    );
  }
}
