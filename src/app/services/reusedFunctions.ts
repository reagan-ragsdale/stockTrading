export class reusedFunctions{
    static epochToLocalTime(epoch: number): string {
        const date = new Date(epoch); // Convert epoch seconds to milliseconds
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    static formatDate(date: Date): string {
        const day = String(date.getDate()).padStart(2, '0'); // Ensure two digits
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    }
}