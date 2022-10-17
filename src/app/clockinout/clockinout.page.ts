import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-clockinout',
  templateUrl: './clockinout.page.html',
  styleUrls: ['./clockinout.page.scss'],
})
export class ClockinoutPage implements OnInit {
  user;
  user_type;
  shift_in;
  shift_out;
  dateTime;
  type;
  clock_out = false;
  date_time_12h_format: any;
  shift_in_12h_format: any;
  shift_out_12h_format: any;

  constructor(private modal: ModalController) { }

  async ngOnInit() {
    let ele = <HTMLElement> document.getElementsByClassName('header')[0];
    
    console.log(ele);
    if (this.type == "Clocked Out") {
      console.log('debug');
      this.clock_out = true;
      ele.setAttribute('style', 'background: #FF0000');
    }
    else {
      ele.setAttribute('style', 'background: #00B389');
    }
    this.user_type = this.user_type[0].toUpperCase() + this.user_type.substring(1).toLowerCase();
    this.changeDateTimeFormat(this.dateTime);
    this.shift_in_12h_format = this.changeTime12hFormat(this.shift_in);
    this.shift_out_12h_format = this.changeTime12hFormat(this.shift_out);
  }

  changeDateTimeFormat(dateTime) {
    const date_time_arr = dateTime.split(" ");
    const date_arr = date_time_arr[0].split("-");
    const date_obj = new Date(date_arr[0], date_arr[1] - 1, date_arr[2]);
    const day = date_obj.toLocaleString('default', { day: '2-digit' });
    const month = date_obj.toLocaleString('default', { month: 'short' });
    const year = date_obj.toLocaleString('default', { year: 'numeric' });
    this.date_time_12h_format = day + '-' + month + '-' + year + ' ';
    this.date_time_12h_format += this.changeTime12hFormat(date_time_arr[1]); 
  }

  changeTime12hFormat(shift_time) {
    shift_time = shift_time.toString ().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [shift_time];

    if (shift_time.length > 1) { // If time format correct
      shift_time = shift_time.slice (1);  // Remove full string match value
      shift_time[5] = +shift_time[0] < 12 ? ' AM' : ' PM'; // Set AM/PM
      shift_time[0] = +shift_time[0] % 12 || 12; // Adjust hours
    }
    return shift_time.join('');
  }

}