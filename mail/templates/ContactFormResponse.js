exports.contactFormResponse = (
    email,
    firstname,
    lastname,
    message,
    phoneNo,
    countrycode
) => {
    return `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Contact Form Response</title>
      <style>
        body {
          background-color: #ffffff;
          font-family: Arial, sans-serif;
          font-size: 16px;
          line-height: 1.4;
          color: #333333;
          margin: 0;
          padding: 0;
        }
  
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
        }
  
        .logo {
          max-width: 200px;
          margin-bottom: 20px;
          padding: 10px;
          border-radius: 10px;
          background-color: #004687;
        }
  
        .message {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 20px;
        }
  
        .body {
          font-size: 16px;
          margin-bottom: 20px;
        }
  
        .support {
          font-size: 14px;
          color: #999999;
          margin-top: 20px;
        }
  
        .highlight {
          font-weight: bold;
        }
      </style>
    </head>
  
    <body>
      <div class="container">
        <a href="https://studynotion-edtech-project.vercel.app"
          ><img
            class="logo"
            src="https://res.cloudinary.com/dmwje3sr4/image/upload/v1685078634/StudyWeb%20logo/final_fphd37.png"
            alt="StudyWeb Logo"
        /></a>
        <div class="message">Customer need our help</div>
        <div class="body">
          <p>${firstname} ${lastname} contacted us for help</p>
          <p>Here are the customer details provided for more information:</p>
          <p>Name: ${firstname} ${lastname}</p>
          <p>Email: ${email}</p>
          <p>Phone Number:${countrycode}${phoneNo}</p>
          <p>Message: ${message}</p>
          <p>Please provide solution to the customer. Thank you!</p>
        </div>
      </div>
    </body>
  </html>`
}