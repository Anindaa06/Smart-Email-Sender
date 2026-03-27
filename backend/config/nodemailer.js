import nodemailer from 'nodemailer'

export const createTransporter = ({ host, port, user, pass }) => {
  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: {
      user,
      pass,
    },
  })
}
