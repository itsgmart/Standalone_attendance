import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PreviewPageRoutingModule } from './preview-routing.module';
import { PreviewPage } from './preview.page';
import { NgxFaceApiJsModule } from 'ngx-face-api-js';
import {CameraPreview} from '@capacitor-community/camera-preview';
import { Ng2SearchPipeModule } from 'ng2-search-filter';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PreviewPageRoutingModule,
    Ng2SearchPipeModule,
  ],
  declarations: [
    PreviewPage,
  ],
  exports: [PreviewPage]
  
})
export class PreviewPageModule {}