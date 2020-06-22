import { Injectable } from '@angular/core';
import {
  Plugins,
  CameraResultType,
  Capacitor,
  FilesystemDirectory,
  CameraPhoto,
  CameraSource
} from '@capacitor/core';

import { Platform } from '@ionic/angular';

const { Camera, Filesystem, Storage } = Plugins;
@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: PhotoI[] = [];

  public photo1: PhotoI[] = [{ filepath: '', webviewPath: '', base64: '', photoId: '' }];
  public photo2: PhotoI[] = [{ filepath: '', webviewPath: '', base64: '', photoId: '' }];

  // Constant acting like keys of photos
  private PHOTO_STORAGE = 'photo';
  private PHOTO_STORAGE1 = 'photo1';
  private PHOTO_STORAGE2 = 'photo2';

  private platform: Platform; // Platform API
  constructor(platform: Platform) {
    this.platform = platform;
  }

  public async addNewToGallery(photoId?: string) {
    // Take a photo
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri, // file - based data; provides best performance
      source: CameraSource.Camera, // automatically take a new photo with the camera
      quality: 100 // highest quality (0 to 100)
    });
    // save the picture and add it to photo collection
    const savedImageFile = await this.savePicture(capturedPhoto);
    this.photos.unshift(savedImageFile);
    if (photoId === '1') {
      this.photo1[0] = savedImageFile;
      // Storage the photo on the device
      Storage.set({
        key: this.PHOTO_STORAGE1,
        value: this.platform.is('hybrid')
          ? JSON.stringify(this.photo1)
          : JSON.stringify(this.photo1.map(p => {
            // Don't save the base64 representation of the photo data,
            // since it's a;lready saved on the Filesystem
            const photoCopy = { ...p };
            delete photoCopy.base64;
            return photoCopy;
          }))
      });
    } else if (photoId === '2') {
      console.log(savedImageFile);
      this.photo2[0] = savedImageFile;
      console.log(this.photo2);
      // Storage the photo on the device
      Storage.set({
        key: this.PHOTO_STORAGE2,
        value: this.platform.is('hybrid')
          ? JSON.stringify(this.photo2)
          : JSON.stringify(this.photo2.map(p => {
            // Don't save the base64 representation of the photo data,
            // since it's a;lready saved on the Filesystem
            const photoCopy = { ...p };
            delete photoCopy.base64;
            return photoCopy;
          }))
      });
    }

    // Storage the photo on the device
    // Storage.set({
    //   key: this.PHOTO_STORAGE,
    //   value: this.platform.is('hybrid')
    //     ? JSON.stringify(this.photos)
    //     : JSON.stringify(this.photos.map(p => {
    //       // Don't save the base64 representation of the photo data,
    //       // since it's a;lready saved on the Filesystem
    //       const photoCopy = { ...p };
    //       delete photoCopy.base64;
    //       return photoCopy;
    //     }))
    // });
  }

  private async savePicture(cameraPhoto: CameraPhoto) {
    // Convert the photo to base64 format, required by filesystem API to save
    const base64Data = await this.readAsBase64(cameraPhoto);

    // write the file to the data directory
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: FilesystemDirectory.Data
    });

    if (this.platform.is('hybrid')) {
      // Display the new image by rewriting the 'file://' path to HTTP
      // Details: https://ionicframework.com/docs/building/webview#file-protocol
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    } else {
      // Use webPath to display the new image instead of base64 since it's
      // already loaded into memory
      return {
        filepath: fileName,
        webviewPath: cameraPhoto.webPath
      };
    }
  }

  public async deletePicture(photo: PhotoI, position: number) {
    // Remove this photo from the photos reference data array
    this.photos.splice(position, 1);

    // Update photo array cache by ovewriting the existing photo array
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    });

    // Delete photo file from Filsystem
    const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1);

    await Filesystem.deleteFile({
      path: filename,
      directory: FilesystemDirectory.Data
    });
  }

  private async readAsBase64(cameraPhoto: CameraPhoto) {
    // "hybrid" will detect cordova or capacitor
    if (this.platform.is('hybrid')) {
      // Read the file into base64 format
      const file = await Filesystem.readFile({
        path: cameraPhoto.path
      });
      return file.data;
    } else {
      // Fetch the photo, read as a blob, then convert to base64 format
      const response = await fetch(cameraPhoto.webPath);
      const blob = await response.blob();
      return await this.convertBlobToBase64(blob) as string;
    }
  }

  convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  })

  public async loadSaved() {
    // Retrive cached photo array data
    // const photos = await Storage.get({
    //   key: this.PHOTO_STORAGE
    // });
    const photo1 = await Storage.get({
      key: this.PHOTO_STORAGE1
    });
    const photo2 = await Storage.get({
      key: this.PHOTO_STORAGE2
    });
    // this.photos = JSON.parse(photos.value) || [];
    this.photo1 = JSON.parse(photo1.value) || [];
    this.photo2 = JSON.parse(photo2.value) || [];

    // When the platform is NOT hybrid, do this
    if (!this.platform.is('hybrid')) {
      // Display the photo by reading into base64 format
      // for (const photo of this.photos) {
      //   // Read each saved photos data from Filesystem
      //   const readFile = await Filesystem.readFile({
      //     path: photo.filepath,
      //     directory: FilesystemDirectory.Data
      //   });
      //   // Web plataform only: save the photo into the base64 field
      //   photo.base64 = `data:image/jpeg;base64,${readFile.data}`;
      // }

      // Read each saved photos data from Filesystem
      const readFile1 = await Filesystem.readFile({
        path: this.photo1[0].filepath,
        directory: FilesystemDirectory.Data
      });
      // Web plataform only: save the photo into the base64 field
      this.photo1[0].base64 = `data:image/jpeg;base64,${readFile1.data}`;

      const readFile2 = await Filesystem.readFile({
        path: this.photo2[0].filepath,
        directory: FilesystemDirectory.Data
      });
      // Web plataform only: save the photo into the base64 field
      this.photo2[0].base64 = `data:image/jpeg;base64,${readFile2.data}`;

    }
  }
}
interface PhotoI {
  filepath: string;
  webviewPath: string;
  base64?: string;
  photoId?: string;
}
