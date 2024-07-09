import { All, Body, Controller, Get, Query } from '@nestjs/common';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}
  @All('/webhook')
  async getInfoLead(@Body() body) {
    let leadId;
    body.leads.status.map((a) => (leadId = a.id));
    const leadData = await this.leadsService.getLeadInfo(
      body.account.id,
      leadId,
    );

    this.leadsService.createPayload(leadData);
  }
  @All('/webhookupdate')
  async getInfoForUpdateLead(@Body() body) {
    let leadId;

    body.leads.update.map((a) => (leadId = a.id));

    const leadData = await this.leadsService.getLeadInfo(
      body.account.id,
      leadId,
    );

    this.leadsService.createPayload(leadData);
  }

  @All('/webhookdelete')
  async getInfoForDeleteLead(@Body() body) {
    let leadId;

    body.leads.delete.map((a) => (leadId = a.id));

    this.leadsService.ifLeadDelete(leadId);
  }

  @All('/webhookaddlead')
  async getInfoForAddLead(@Body() body) {
    let leadId;

    body.leads.add.map((a) => (leadId = a.id));
    this.leadsService.leadCreate(leadId, body.leads.add);
  }
}
