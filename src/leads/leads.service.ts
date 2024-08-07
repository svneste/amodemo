import { Injectable } from '@nestjs/common';
import { AccountsService } from 'src/accounts/accounts.service';
import { Repository } from 'typeorm';
import { Leads } from './entities/leads.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class LeadsService {
  constructor(
    private accountService: AccountsService,
    @InjectRepository(Leads)
    private leadsRepo: Repository<Leads>,
  ) {}

  async createApiService(amoId) {
    return await this.accountService.createConnector(amoId);
  }

  async getLeadInfo(amoId, leadId) {
    const api = await this.createApiService(amoId);

    const lead = await api.get(`/api/v4/leads/${leadId}`);
    return lead.data;
  }

  async saveLeadData(payload, id) {
    const lead = await this.leadsRepo.findOne({
      where: {
        idLead: payload.idLead,
      },
    });

    if (!lead) {
      return await this.leadsRepo.save(payload);
    } else {
      lead.createdLead = payload.createdLead;
      lead.updatedLead = payload.updatedLead;
      lead.closedLead = payload.closedLead;
      lead.leadName = payload.leadName;
      lead.responsible_user = payload.responsible_user;
      lead.status_id = payload.status_id;
      lead.pipeline_id = payload.pipeline_id;
      lead.price = payload.price;
      lead.invoice = payload.invoice;
      lead.bill = payload.bill;
      lead.service = payload.service;
      return await this.leadsRepo.save(lead);
    }
  }

  async createPayload(leadData) {
    const payload = {
      idLead: leadData.id,
      createdLead: leadData.created_at,
      updatedLead: leadData.updated_at,
      closedLead: leadData.closed_at,
      leadName: leadData.name,
      responsible_user: leadData.responsible_user_id,
      status_id: leadData.status_id,
      pipeline_id: leadData.pipeline_id,
      price: leadData.price,
      invoice: null,
      bill: null,
      service: null,
    };

    if (leadData.custom_fields_values === null) {
      return;
    } else {
      leadData.custom_fields_values.map((a) => {
        if (a.field_id === 994677) {
          a.values.map((a) => (payload.invoice = a.value));
        }
        if (a.field_id === 994679) {
          a.values.map((a) => (payload.bill = a.value));
        }
        if (a.field_id === 917745) {
          a.values.map((a) => (payload.service = a.value));
        }
      });
    }

    await this.saveLeadData(payload, leadData.id);
  }

  // Если сделка удалена обновляем инфу в базе

  async ifLeadDelete(leadID) {
    const lead = await this.leadsRepo.findOne({
      where: {
        idLead: leadID,
      },
    });
    return await this.leadsRepo.remove(lead);
  }

  // при создании сделки

  async leadCreate(leadId, data) {
    const payload = {
      idLead: '',
      createdLead: null,
      updatedLead: null,
      closedLead: null,
      leadName: '',
      responsible_user: null,
      status_id: null,
      pipeline_id: null,
      price: null,
      invoice: null,
      bill: null,
      service: null,
    };

    data.map((a) => {
      payload.idLead = a.id;
      payload.createdLead = a.created_at;
      payload.updatedLead = a.updated_at;
      payload.leadName = a.name;
      payload.responsible_user = a.responsible_user_id;
      payload.status_id = a.status_id;
      payload.pipeline_id = a.pipeline_id;
      payload.price = a.price;
    });

    await this.saveLeadData(payload, leadId);
  }

  // Подготовка партии сделок и сохранение сделок в базу
  async pre(leadlist) {
    await leadlist.map((a) => {
      return this.createPayload(a);
    });
  }

  async getAllLeadForCRM() {
    const api = await this.createApiService(30938754);
    console.log('Запустили получение сделок');

    for (let i = 0; i < 35; i++) {
      const leadlist = await api.get(`/api/v4/leads?limit=100&page=${i}`);
      if (leadlist.data.length === 0) {
        return;
      } else {
        console.log(leadlist.data._embedded.leads, 'Отработал', i);
        await this.pre(leadlist.data._embedded.leads);
      }
    }
  }
}
