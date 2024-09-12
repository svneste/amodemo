import { All, Body, Controller, Get, Query } from '@nestjs/common';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}
  @All('webhook')
  async getInfoLead(@Body() body) {
    const accountId = body.account.id;

    const leadId = await this.leadsService.checkRequest(body);
    if (leadId === undefined) {
      return;
    }
    const leadInfo = await this.leadsService.getLeadInfo(accountId, leadId);

    const payload = await this.leadsService.createPayload(leadInfo);
    const leadForBase = await this.leadsService.saveLeadData(payload);
    return leadForBase;
  }
}
