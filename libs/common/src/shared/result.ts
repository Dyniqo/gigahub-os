import { AppError } from './app-error';

export type Result<TValue> = Success<TValue> | Failure;

export class Success<TValue> {
  readonly isSuccess = true;
  readonly isFailure = false;

  constructor(public readonly value: TValue) {}
}

export class Failure {
  readonly isSuccess = false;
  readonly isFailure = true;

  constructor(public readonly error: AppError) {}
}

export const ok = <TValue>(value: TValue): Result<TValue> => new Success(value);

export const fail = (error: AppError): Result<never> => new Failure(error);
