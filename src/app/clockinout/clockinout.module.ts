import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ClockinoutPageRoutingModule } from './clockinout-routing.module';

import { ClockinoutPage } from './clockinout.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ClockinoutPageRoutingModule
  ],
  declarations: [ClockinoutPage]
})
export class ClockinoutPageModule {}
