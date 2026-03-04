declare module "bakong-khqr" {
    export class BakongKHQR {
        generateMerchant(data: {
            bakongAccountId: string;
            merchantName: string;
            merchantCity: string;
            amount: number;
            currency: string;
            billNumber: string;
            mobileNumber: string;
            storeLabel: string;
            terminalLabel: string;
        }): KHQRResponse;

        generateIndividual(data: {
            bakongAccountId: string;
            merchantName: string;
            amount: number;
            currency: string;
        }): KHQRResponse;

        verify(qr: string): boolean;
        decode(qr: string): any;
    }

    export interface KHQRResponse {
        status: {
            code: number;
            message: string;
        };
        data: {
            qr: string;
            md5: string;
        };
    }
}
