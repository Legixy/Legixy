import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { isPlainDate } from '../domain/plain-date';

/**
 * Validates a calendar date in "YYYY-MM-DD" form.
 *
 * Stricter than class-validator's `@IsDateString()`, which accepts full ISO
 * timestamps. Accepting "2026-10-31T21:00:00Z" here would smuggle a time and
 * a timezone into a field the domain treats as a pure calendar date — exactly
 * the ambiguity `plain-date.ts` exists to eliminate.
 *
 * Also rejects real-looking but non-existent dates such as "2026-02-30".
 */
export function IsPlainDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isPlainDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && isPlainDate(value);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a real calendar date in YYYY-MM-DD format (no time, no timezone)`;
        },
      },
    });
  };
}
