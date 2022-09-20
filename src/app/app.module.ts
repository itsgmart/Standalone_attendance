import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicStorageModule } from '@ionic/storage-angular';
import { IonicModule, IonicRouteStrategy} from '@ionic/angular';
import { GlobalProviderService } from '../app/services/global-provider.service';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { PreviewPageModule } from "./preview/preview.module";
import { Globalization } from '@awesome-cordova-plugins/globalization/ngx';
import { HttpClientModule } from '@angular/common/http';
import { Ng2SearchPipeModule } from 'ng2-search-filter';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    IonicStorageModule.forRoot(),
    HttpClientModule,
    AppRoutingModule,
    PreviewPageModule,
    Ng2SearchPipeModule
  ],
  providers: [
    GlobalProviderService,
    Globalization,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
