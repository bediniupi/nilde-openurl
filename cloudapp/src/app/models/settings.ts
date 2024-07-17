// by default only new and ready to send request can be sent to Nilde
export class Settings {
   brstatus = [
    {   code: "REQUEST_CREATED_BOR",
        active: true
    },
    {
        code: "READY_TO_SEND",
        active: true
    }
   ];
 }
