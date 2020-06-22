import { Component, OnInit } from '@angular/core';
import { PhotoService } from '../services/photo.service';
import { ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {
  constructor(
    public photoService: PhotoService,
    public actionSheetCtrl: ActionSheetController
  ) {
  }

  public async showActionSheet(photo, position) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Photos',
      buttons: [{
        text: 'Delete',
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.photoService.deletePicture(photo, position);
        }
      }]
    });
    await actionSheet.present();
  }

  ngOnInit() {
    // load photos saved
    // this.photoService.loadSaved();
  }

}
