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

  // запрашиваем данные по сделке по ID
  async getLeadInfo(accountId, leadId) {
    const api = await this.createApiService(accountId);

    const lead = await api.get(`/api/v4/leads/${leadId}`);
    return lead.data;
  }

  // найти в базе сделку по ID
  async getLeadForBase(idLead) {
    return await this.leadsRepo.findOne({
      where: {
        idLead: idLead,
      },
    });
  }

  async saveLeadData(payload) {
    const lead = await this.getLeadForBase(payload.idLead);

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
      lead.dateFullBill = payload.dateFullBill;
      return await this.leadsRepo.save(lead);
    }
  }

  async createPayload(leadInfo) {
    const payload = {
      idLead: leadInfo.id,
      createdLead: leadInfo.created_at,
      updatedLead: leadInfo.updated_at,
      closedLead: leadInfo.closed_at,
      leadName: leadInfo.name,
      responsible_user: leadInfo.responsible_user_id,
      status_id: leadInfo.status_id,
      pipeline_id: leadInfo.pipeline_id,
      price: leadInfo.price,
      invoice: null,
      bill: null,
      service: null,
      dateFullBill: null,
    };

    console.log(leadInfo.custom_fields_values);

    if (leadInfo.custom_fields_values === null) {
      return payload;
    } else {
      leadInfo.custom_fields_values.map((a) => {
        if (a.field_id === 994677) {
          a.values.map((a) => (payload.invoice = a.value));
        }
        if (a.field_id === 994679) {
          a.values.map((a) => (payload.bill = a.value));
        }
        if (a.field_id === 917745) {
          a.values.map((a) => (payload.service = a.value));
        }
        if (a.field_id === 985739) {
          a.values.map(
            (a) => (payload.dateFullBill = new Date(a.value * 1000)),
          );
        }
      });
    }

    return payload;
  }

  // Если сделка удалена обновляем инфу в базе
  async ifLeadDelete(leadID) {
    const lead = await this.leadsRepo.findOne({
      where: {
        idLead: leadID,
      },
    });

    if (!lead) {
      console.log('Запустилась отработка ошибки');
      return;
    }

    const leadDeleted = await this.leadsRepo.remove(lead);
    return leadDeleted;
  }

  // Подготовка партии сделок и сохранение сделок в базу
  async pre(leadlist) {
    leadlist.map((a) => {
      this.createPayloadLoadingLead(a);
    });
  }

  async createPayloadLoadingLead(leadInfo) {
    const payload = {
      idLead: leadInfo.id,
      createdLead: leadInfo.created_at,
      updatedLead: leadInfo.updated_at,
      closedLead: leadInfo.closed_at,
      leadName: leadInfo.name,
      responsible_user: leadInfo.responsible_user_id,
      status_id: leadInfo.status_id,
      pipeline_id: leadInfo.pipeline_id,
      price: leadInfo.price,
      invoice: null,
      bill: null,
      service: null,
      dateFullBill: null,
    };

    if (leadInfo.custom_fields_values === null) {
      return payload;
    } else {
      leadInfo.custom_fields_values.map((a) => {
        if (a.field_id === 994677) {
          a.values.map((a) => (payload.invoice = a.value));
        }
        if (a.field_id === 994679) {
          a.values.map((a) => (payload.bill = a.value));
        }
        if (a.field_id === 917745) {
          a.values.map((a) => (payload.service = a.value));
        }
        if (a.field_id === 985739) {
          a.values.map(
            (a) => (payload.dateFullBill = new Date(a.value * 1000)),
          );
        }
      });
    }

    return await this.saveLeadData(payload);
  }

  async checkRequest(body) {
    let leadId;
    if (body.leads.add !== undefined) {
      await body.leads.add.map((a) => (leadId = a.id));
      return leadId;
    } else if (body.leads.update !== undefined) {
      await body.leads.update.map((a) => (leadId = a.id));
      return leadId;
    } else if (body.leads.delete !== undefined) {
      await body.leads.delete.map((a) => (leadId = a.id));
      await this.ifLeadDelete(leadId);
      return undefined;
    } else {
      console.log('Нет такого сценария');
    }
  }

  async getLeadsForUser(id) {
    const api = await this.createApiService(30938754);

    for (let i = 0; i < 700; i++) {
      const leadListUsers = await api.get(
        `/api/v4/leads?filter[responsible_user_id]=${id}&limit=10&page=${i}`,
      );
      if (leadListUsers.data.length === 0) {
        return;
      } else {
        console.log(leadListUsers.data._embedded.leads, 'Отработал', i);
        await this.pre(leadListUsers.data._embedded.leads);
      }
    }
  }

  async getLeadsAll() {
    const api = await this.createApiService(30938754);
    for (let i = 0; i < 10000; i++) {
      const leadAll = await api.get(`/api/v4/leads?limit=15&page=${i}`);
      if (leadAll.data.length === 0) {
        return;
      } else {
        console.log(leadAll.data._embedded.leads, 'Отработал', i);
        await this.pre(leadAll.data._embedded.leads);
      }
    }
  }
}
