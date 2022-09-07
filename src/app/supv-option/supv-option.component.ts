import { Component, OnInit } from '@angular/core';

import { ModalController } from '@ionic/angular';
@Component({
  selector: 'app-supv-option',
  templateUrl: './supv-option.component.html',
  styleUrls: ['./supv-option.component.scss'],
})
export class SupvOptionComponent implements OnInit {

  msg = 'Do you want to clock in as User or Supervisor?';


  constructor(private modal:ModalController) { }

  ngOnInit() {}

  dismissModal(data) {
    this.modal.dismiss({'role': data});
  }


}
