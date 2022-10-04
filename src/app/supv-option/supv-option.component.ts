import { Component, OnInit } from '@angular/core';

import { ModalController } from '@ionic/angular';
@Component({
  selector: 'app-supv-option',
  templateUrl: './supv-option.component.html',
  styleUrls: ['./supv-option.component.scss'],
})
export class SupvOptionComponent implements OnInit {

  msg = 'Do you want to clock in as User or Supervisor?';
  supv:any;

  constructor(private modal:ModalController) { }

  ngOnInit() {}

  dismissModal(data) {
    this.modal.dismiss({'role': data});
  }

  cancel() {
    console.log('cancel pressed');
    this.modal.dismiss({'role': ''});
  } 

  submit() {
    let selection = <HTMLInputElement>document.getElementById('supv');
    
    if (selection.checked) {
      this.modal.dismiss({'role': 'supervisor'});
    }
    else {
      this.modal.dismiss({'role': 'user'});
    }
  }

}
