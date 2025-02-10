export class reusedFunctions{
    static epochToLocalTime(epoch: number): string {
        const date = new Date(epoch * 1000); // Convert epoch seconds to milliseconds
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }
}