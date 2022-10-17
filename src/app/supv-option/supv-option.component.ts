import { Component, OnInit } from '@angular/core';

import { ModalController } from '@ionic/angular';
@Component({
  selector: 'app-supv-option',
  templateUrl: './supv-option.component.html',
  styleUrls: ['./supv-option.component.scss'],
})

  

export class SupvOptionComponent implements OnInit 
{

  msg = 'Do you want to clock in as User or Supervisor?';
  supv:any;

  constructor(private modal:ModalController) { }

  ngOnInit() {

    document.getElementById('p1').style.backgroundColor = "#DEE8FE";
  }

  dismissModal(data) 
  {
    this.modal.dismiss({'role': data});
  }

  cancel() 
  {
    console.log('cancel pressed');
    this.modal.dismiss({'role': ''});
  } 

  submit() 
  {
    let selection = <HTMLInputElement>document.getElementById('supv');
    
    if (selection.checked) {
      this.modal.dismiss({'role': 'supervisor'});
    }
    else {
      this.modal.dismiss({'role': 'user'});
    }
  }

  clickSelection(id) 
  {
    //var radios = document.getElementsByName('cases');
    // let selection1 = <HTMLInputElement>document.getElementById('');
    // console.log(selection1);
    // console.log(id);

    if(id == 'p2')
    {
    document.getElementById('p2').style.backgroundColor = "#DEE8FE"; //blue
    document.getElementById('p1').style.backgroundColor = "#FCFCFC"; //white
    }
    else
    {
    document.getElementById('p1').style.backgroundColor = "#DEE8FE";
    document.getElementById('p2').style.backgroundColor = "#FCFCFC";
    }
  }

}


