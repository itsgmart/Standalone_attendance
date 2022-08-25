import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ClockinoutPage } from './clockinout.page';

const routes: Routes = [
  {
    path: '',
    component: ClockinoutPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClockinoutPageRoutingModule {}
