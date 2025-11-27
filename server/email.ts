import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface SendWorkOrderDemandEmailParams {
  to: string;
  technician: string;
  workOrderNumber: string;
  title: string;
  priority: string;
  customer: string;
  asset: string;
  problemSummary: string;
}

export interface SendWorkOrderAssignmentEmailParams {
  to: string;
  assignedTo: string;
  workOrderNumber: string;
  title: string;
  priority: string;
  customer: string;
  asset: string;
}

export async function sendWorkOrderDemandEmail(params: SendWorkOrderDemandEmailParams) {
  if (!resend) {
    console.log('Resend API key not configured. Email would have been sent to:', params.to);
    return { id: 'mock-email-id' };
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'ELEVEX ERP <onboarding@resend.dev>',
      to: params.to,
      subject: `New Work Order Demand: ${params.workOrderNumber} - ${params.title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #8ACCD5 0%, #8E7DBE 50%, #FF90BB 100%);
                color: white;
                padding: 20px;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background: #f9f9f9;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 0 0 8px 8px;
              }
              .field {
                margin-bottom: 15px;
              }
              .label {
                font-weight: bold;
                color: #555;
              }
              .priority-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 4px;
                font-weight: bold;
                font-size: 12px;
                text-transform: uppercase;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>New Work Order Demand</h1>
                <p>A technician has submitted a new work order demand that requires your attention.</p>
              </div>
              <div class="content">
                <div class="field">
                  <span class="label">Work Order:</span> ${params.workOrderNumber}
                </div>
                <div class="field">
                  <span class="label">Title:</span> ${params.title}
                </div>
                <div class="field">
                  <span class="label">Priority:</span>
                  <span class="priority-badge" style="background: ${
                    params.priority === 'Urgent' ? '#ef4444' : 
                    params.priority === 'High' ? '#f97316' : '#3b82f6'
                  }; color: white;">${params.priority}</span>
                </div>
                <div class="field">
                  <span class="label">Submitted by:</span> ${params.technician}
                </div>
                <div class="field">
                  <span class="label">Customer:</span> ${params.customer}
                </div>
                <div class="field">
                  <span class="label">Asset:</span> ${params.asset}
                </div>
                <div class="field">
                  <span class="label">Problem Summary:</span>
                  <p>${params.problemSummary}</p>
                </div>
                <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
                  Please review this demand in the ELEVEX ERP system and convert it to a full work order with tasks and budget allocation.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send email:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function sendWorkOrderAssignmentEmail(params: SendWorkOrderAssignmentEmailParams) {
  if (!resend) {
    console.log('Resend API key not configured. Assignment email would have been sent to:', params.to);
    return { id: 'mock-assignment-email-id' };
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'ELEVEX ERP <onboarding@resend.dev>',
      to: params.to,
      subject: `Work Order Assigned: ${params.workOrderNumber} - ${params.title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #8ACCD5 0%, #8E7DBE 50%, #FF90BB 100%);
                color: white;
                padding: 20px;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background: #f9f9f9;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 0 0 8px 8px;
              }
              .field {
                margin-bottom: 15px;
              }
              .label {
                font-weight: bold;
                color: #555;
              }
              .priority-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 4px;
                font-weight: bold;
                font-size: 12px;
                text-transform: uppercase;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Work Order Assigned to You</h1>
                <p>You have been assigned a new work order in ELEVEX ERP.</p>
              </div>
              <div class="content">
                <div class="field">
                  <span class="label">Work Order:</span> ${params.workOrderNumber}
                </div>
                <div class="field">
                  <span class="label">Title:</span> ${params.title}
                </div>
                <div class="field">
                  <span class="label">Priority:</span>
                  <span class="priority-badge" style="background: ${
                    params.priority === 'Urgent' ? '#ef4444' : 
                    params.priority === 'High' ? '#f97316' : '#3b82f6'
                  }; color: white;">${params.priority}</span>
                </div>
                <div class="field">
                  <span class="label">Customer:</span> ${params.customer}
                </div>
                <div class="field">
                  <span class="label">Asset:</span> ${params.asset}
                </div>
                <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
                  Please log in to ELEVEX ERP to review the work order details and begin work.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send assignment email:', error);
      throw error;
    }

    console.log('Assignment email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending assignment email:', error);
    throw error;
  }
}
