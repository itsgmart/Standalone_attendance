import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import {GlobalProviderService} from '../../services/global-provider.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  storage = this.global.storage;
  login_status:any; 

  constructor(private router: Router, private global: GlobalProviderService) { }

  ngOnInit() {
    console.log('Initiating navBar!');
    this.storage.get('login_status').then( value => { 
      this.login_status = value; 
    });
  }

  async getLogin() {
    let logoutText = "Do you wish to log out?";
    if(confirm(logoutText)){
      this.storage.set('login_status', false);
      this.storage.set('user','');
      this.storage.set('attendance_assignment', '');
      this.router.navigate(['/home']);
    }
  }

  getCamera() {
    this.router.navigate(['/preview']);

  }

  getLogs() {
    this.router.navigate(['/logs']);

  }

  refresh() {
    window.location.reload();
  }
}
