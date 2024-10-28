import {
  All,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}
  @All('webhook')
  @HttpCode(200)
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
  @HttpCode(200)
  getLeadsForUser(@Param('id') id: string) {
    return this.leadsService.getLeadsForUser(id);
  }

  @Get('getall')
  @HttpCode(200)
  async getLeadsAll() {
    return await this.leadsService.getLeadsAll();
  }
}
