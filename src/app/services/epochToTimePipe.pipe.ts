import { Pipe, PipeTransform } from '@angular/core';
import { reusedFunctions } from './reusedFunctions';

@Pipe({
  standalone: true,
  name: 'epochToTimePipe'
})
export class EpochToTimePipe implements PipeTransform {
  transform(value: number): string {
    return reusedFunctions.epochToLocalTime(value)
    
  }
}