export class reusedFunctions {
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

        return `${month}/${day}/${year}`;
    }
    static is830AMCT(epochTime: number): boolean {
        const date = new Date(epochTime);

        // Convert to America/Chicago time
        const formattedTime = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit', hour12: false }).format(date);

        return formattedTime === "08:30";
    }
    static isWithinTradingHours(epochMillis: number): boolean {
        const date = new Date(epochMillis);
        const centralOffset = -5; // Central Time (CT) is UTC-5 (Standard), UTC-6 (Daylight Saving Time)
        const centralHours = date.getUTCHours() + centralOffset;
        const minutes = date.getUTCMinutes();

        const startHour = 8;
        const startMinute = 30;
        const endHour = 15;
        const endMinute = 0;

        // Convert time to total minutes for easy comparison
        const timeInMinutes = centralHours * 60 + minutes;
        const startTimeInMinutes = startHour * 60 + startMinute;
        const endTimeInMinutes = endHour * 60 + endMinute;

        return timeInMinutes >= startTimeInMinutes && timeInMinutes <= endTimeInMinutes;
    }
    static isWithinTradingHoursLocal(epochMillis: number): boolean {
        const date = new Date(epochMillis);

        // Convert to Central Time (CT)
        const options: Intl.DateTimeFormatOptions = {
            timeZone: 'America/Chicago',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23'
        };

        const timeStr = new Intl.DateTimeFormat('en-US', options).format(date);
        const [hour, minute] = timeStr.split(':').map(Number);

        // Convert hours and minutes to total minutes for easier comparison
        const totalMinutes = hour * 60 + minute;

        // Define trading hours in minutes (8:30 AM = 510 min, 3:00 PM = 900 min)
        return totalMinutes >= 510 && totalMinutes <= 900;
    }
}