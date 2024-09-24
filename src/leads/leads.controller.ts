import { All, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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
  // сделать запрос по которому мы сможем выгружать сделки отдельно для каждого сотрудника

  @Get('user/:id')
  getLeadsForUser(@Param('id') id: string) {
    return this.leadsService.getLeadsForUser(id);
  }
}
