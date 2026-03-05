declare module "bakong-khqr" {
    export class BakongKHQR {
        generateMerchant(info: MerchantInfo): KHQRResponse;
        generateIndividual(info: IndividualInfo): KHQRResponse;
        static verify(qr: string): { isValid: boolean };
        static decode(qr: string): any;
        static generateDeepLink(url: string, qr: string, sourceInfo?: SourceInfo): Promise<KHQRResponse>;
    }

    export class IndividualInfo {
        constructor(
            bakongAccountID: string,
            merchantName: string,
            merchantCity: string,
            optional?: {
                currency?: number;
                amount?: number;
                billNumber?: string;
                storeLabel?: string;
                terminalLabel?: string;
                mobileNumber?: string;
                expirationTimestamp?: string;
                accountInformation?: string;
                acquiringBank?: string;
            }
        );
    }

    export class MerchantInfo extends IndividualInfo {
        constructor(
            bakongAccountID: string,
            merchantName: string,
            merchantCity: string,
            merchantID: string,
            acquiringBank: string,
            optional?: {
                currency?: number;
                amount?: number;
                billNumber?: string;
                storeLabel?: string;
                terminalLabel?: string;
                expirationTimestamp?: string;
            }
        );
    }

    export class SourceInfo {
        constructor(appIconUrl: string, appName: string, appDeepLinkCallback: string);
    }

    export interface KHQRResponse {
        status: {
            code: number;
            errorCode?: string | number;
            message: string;
        };
        data: {
            qr: string;
            md5: string;
        };
    }

    export const khqrData: {
        currency: {
            usd: number;   // 840
            khr: number;   // 116
        };
        merchantType: {
            merchant: string;
            individual: string;
        };
    };
}
