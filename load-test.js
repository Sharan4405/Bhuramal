import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 50,
  iterations: 50,
};


export default function () {

  // 50 unique users
const userId = __VU;

const phoneNumber = `919999000${userId}`;

const userName = `Test User ${userId}`;


  const payload = JSON.stringify({
    object: "whatsapp_business_account",

    entry: [
      {
        id: "123456789",

        changes: [
          {
            field: "messages",

            value: {
              messaging_product: "whatsapp",

              contacts: [
                {
                  profile: {
                    name: userName
                  },

                  wa_id: phoneNumber
                }
              ],


              messages: [
                {
                  id: `wamid.TEST${userId}`,

                  from: phoneNumber,

                  timestamp: `${Math.floor(Date.now() / 1000)}`,

                  type: "text",

                  text: {
                    body: `Hello from ${userName}`
                  }
                }
              ]
            }
          }
        ]
      }
    ]
  });


  const params = {
    headers: {
      "Content-Type": "application/json"
    }
  };


  const res = http.post(
    "http://localhost:4000/webhook",
    payload,
    params
  );


  check(res, {
    "Webhook status 200": (r) => r.status === 200,
  });


  sleep(1);
}