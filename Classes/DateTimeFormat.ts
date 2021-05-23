import {User} from './User';

export class DateTimeFormat {
  year: string;
  month: string;
  day: string;
  hour: string;
  user: User;


  constructor(year: string, month: string, day: string, hour: string, user: User) {
    this.year = year;
    this.month = month;
    this.day = day;
    this.hour = hour;
    this.user = user;
  }
}
