import {DateTimeFormat} from "../../Classes/DateTimeFormat";
import {User} from "../../Classes/User";

export class DateRange {

    public dateArray: DateTimeFormat[];
    public hoursArray: string[];
    public dateUrl: string[] = new Array<string>();

    constructor(firstDate: Date, secondDate: Date, firstHour: string, secondHour: string, user: User) {
        // @ts-ignore
        Date.prototype.addDays = function (days) {
            const date = new Date(this.valueOf());
            date.setDate(date.getDate() + days);
            return date;
        }
        this.hoursArray = this.getHours(firstHour, secondHour);
        this.dateArray = this.formatDate(this.getDates(firstDate, secondDate), user, this.hoursArray);

        this.dateArray.forEach(d => {
            this.dateUrl.push(d.year + d.month + d.day + '-' + d.hour + '0000');
        })
    }

    getDates(startDate, stopDate) {
        const dateArray = [];
        let currentDate = startDate;
        while (currentDate <= stopDate) {
            dateArray.push(new Date(currentDate));
            currentDate = currentDate.addDays(1);
        }
        return dateArray;
    }

    formatDate(dateArray: Date[], user: User, arrayHours: string[]): DateTimeFormat[] {
        let dateArrayFormatted: DateTimeFormat[] = new Array<DateTimeFormat>();
        dateArray.forEach(d => {
            arrayHours.forEach(h => {
                let dateToISOStringSplit = d.toISOString().split('T')[0];
                let arr = dateToISOStringSplit.split('-');
                dateArrayFormatted.push(new DateTimeFormat(arr[0], arr[1], arr[2], h, user));
            })
        })
        return dateArrayFormatted;
    }

    getHours(startHour: string, endHour: string): string[] {
        let firstHour = parseInt(startHour, 10);
        let secondHour = parseInt(endHour, 10);
        let arrayHours = [];
        let i = firstHour;
        while (i <= secondHour) {
            if (i < 10) {
                let y = '0' + i;
                arrayHours.push(y);
            } else {
                arrayHours.push(i.toString())
            }
            i++;
        }
        return arrayHours;
    }
}
