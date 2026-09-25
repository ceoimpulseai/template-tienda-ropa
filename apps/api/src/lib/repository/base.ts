import { randomUUID } from 'node:crypto';
import {
  Model,
  ModelStatic,
  FindOptions,
  CreateOptions,
  WhereOptions,
} from 'sequelize';
import { NotFoundError } from '../../lib/errors.js';

export class TenantRepository<T extends Model> {
  protected model: ModelStatic<T>;
  protected tenantKey: string;
  protected entityName: string;

  constructor(model: ModelStatic<T>, tenantKey: string = 'businessId') {
    this.model = model;
    this.tenantKey = tenantKey;
    this.entityName = model.name.toUpperCase();
  }

  private buildWhere(businessId: string, options?: FindOptions<T>): WhereOptions<T> {
    const baseWhere = { [this.tenantKey]: businessId } as WhereOptions<T>;
    if (!options?.where) return baseWhere;
    return { ...options.where, ...baseWhere } as WhereOptions<T>;
  }

  async findAll(businessId: string, options?: FindOptions<T>): Promise<T[]> {
    return this.model.findAll({
      ...options,
      where: this.buildWhere(businessId, options),
    });
  }

  async findOne(businessId: string, entityId: string, options?: FindOptions<T>): Promise<T | null> {
    return this.model.findOne({
      ...options,
      where: {
        id: entityId,
        [this.tenantKey]: businessId,
      } as unknown as WhereOptions<T>,
    });
  }

  async findById(businessId: string, entityId: string, options?: FindOptions<T>): Promise<T> {
    const entity = await this.findOne(businessId, entityId, options);
    if (!entity) {
      throw new NotFoundError(`${this.entityName}_NOT_FOUND`);
    }
    return entity;
  }

  async create(
    businessId: string,
    data: Partial<T['_creationAttributes']>,
    options?: CreateOptions<T>
  ): Promise<T> {
    return this.model.create(
      {
        id: randomUUID(),
        [this.tenantKey]: businessId,
        ...data,
      } as T['_creationAttributes'],
      options
    );
  }

  async update(
    businessId: string,
    entityId: string,
    data: Partial<T['_creationAttributes']>
  ): Promise<T> {
    const entity = await this.findById(businessId, entityId);
    return entity.update(data);
  }

  async remove(businessId: string, entityId: string): Promise<void> {
    const entity = await this.findById(businessId, entityId);
    await entity.destroy();
  }

  async count(businessId: string, options?: FindOptions<T>): Promise<number> {
    return this.model.count({
      ...options,
      where: this.buildWhere(businessId, options),
    });
  }
}