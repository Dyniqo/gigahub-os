import { ArgumentMetadata, BadRequestException, PipeTransform } from '@nestjs/common';

type EnumLike = Record<string, string | number>;

export class OptionalEnumPipe<TEnum extends EnumLike> implements PipeTransform<
  unknown,
  TEnum[keyof TEnum] | undefined
> {
  private readonly values: string[];

  constructor(enumObject: TEnum) {
    this.values = Object.values(enumObject).map((value) => String(value));
  }

  transform(value: unknown, metadata: ArgumentMetadata): TEnum[keyof TEnum] | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value !== 'string' || !this.values.includes(value)) {
      throw new BadRequestException(
        `${metadata.data ?? 'value'} must be one of: ${this.values.join(', ')}`,
      );
    }

    return value as TEnum[keyof TEnum];
  }
}
