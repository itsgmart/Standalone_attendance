import { Component, OnInit } from '@angular/core';
import { BooleanValueAccessor } from '@ionic/angular';
import { TouchSequence } from 'selenium-webdriver';
import { GlobalProviderService } from 'src/app/services/global-provider.service';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
})
export class DetailsComponent implements OnInit {
  attendance_assignment: any;
  show_details = false;
  user_logged_in: boolean = false;
  location_code;
  overtime_limit;
  cleaner_int;
  supervisor_int;
  cleaner_shifts; 
  supervisor_shifts;
  supervisors;
  cleaners;
  storage = this.global.storage;
  id: any;
  login_prompt = "To start your shift, please enter the location access codes, via the top right navigation bar.";

  constructor(private global: GlobalProviderService) { }

  ngOnInit() {
    console.log('Initialising details');
    this.getLoggedIn();
    this.getDetails();
  }


  getLoggedIn() {
    this.storage.get('login_status').then( data => { 
      console.log('data', data);
      this.user_logged_in = data;
    });
  }

  getDetails() {
    this.storage.get("attendance_assignment").then((data) => {
      console.log(data);
      this.location_code = data['attendance_assignment']['location_code'];
      this.overtime_limit = data['attendance_assignment']['overtime_limit'];
      this.cleaner_int = data['attendance_assignment']['scan_interval_user'];
      this.supervisor_int = data['attendance_assignment']['scan_interval_supervisor'];
      this.cleaner_shifts = data['attendance_assignment']['shift_hours'];
      this.supervisor_shifts = data['attendance_assignment']['shift_hours_supervisor'];
    });
  }

  toggleDetails() {
    this.show_details = !this.show_details;
  }
}
