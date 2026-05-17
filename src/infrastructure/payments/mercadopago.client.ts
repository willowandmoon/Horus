import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
});

export const mp = {
    preferences: new Preference(client),
    payment: new Payment(client),
};
