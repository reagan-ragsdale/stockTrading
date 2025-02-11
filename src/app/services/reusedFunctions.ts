export class reusedFunctions{
    static epochToLocalTime(epoch: number): string {
        let date = new Date(epoch * 1000);

    // Get hours and minutes
    let hours = date.getHours();
    let minutes = date.getMinutes();

    // Format to always have two digits
    let formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    return formattedTime;
    }
}