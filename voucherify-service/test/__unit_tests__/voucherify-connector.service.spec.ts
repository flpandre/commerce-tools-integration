import { Test, TestingModule } from '@nestjs/testing';
import { VoucherifyConnectorService } from '../../src/voucherify/voucherify-connector.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { RequestJsonLogger } from '../../src/configs/requestJsonLogger';
import {
  createOrderItems,
  createOrderOrderCreateObject,
  createOrderOrderObject,
  getAvailablePromotionsCart,
  getAvailablePromotionsResponseObject,
  getAvailablePromotionsValidateWith,
  redeemStackableVouchersRequest,
  redeemStackableVouchersResponse,
  validateStackableResponse,
  validateStackableVouchersRequest,
} from './payloads/voucherify-connector.service.spec.paylaods';

describe('VoucherifyConnectorService', () => {
  let service: VoucherifyConnectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [
        VoucherifyConnectorService,
        ConfigService,
        Logger,
        RequestJsonLogger,
      ],
    }).compile();

    service = module.get<VoucherifyConnectorService>(
      VoucherifyConnectorService,
    );

    // service.getClient = jest.fn().mockResolvedValue({});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should check if validateStackable was called 1 time', async () => {
    const validateStackable = jest
      .fn()
      .mockReturnValue(validateStackableResponse);

    service.getClient = jest.fn().mockReturnValue({
      validations: {
        validateStackable,
      },
    });

    const response_ = await service.validateStackableVouchers(
      validateStackableVouchersRequest as any,
    );

    expect(validateStackable).toBeCalledTimes(1);
    expect(response_).toMatchObject(validateStackableResponse);
  });

  it('should check if releaseValidationSession was called 3 times', async () => {
    const releaseValidationSession = jest.fn().mockResolvedValue(undefined);

    service.getClient = jest.fn().mockReturnValue({
      vouchers: {
        releaseValidationSession,
      },
    });

    await service.releaseValidationSession(['1', '2', '3'], 'sessionKey');
    expect(releaseValidationSession).toBeCalledTimes(3);
  });

  it('should check if validate was called 1 time, and items were mapped correctly', async () => {
    const checkEligibility = jest.fn().mockResolvedValue({
      redeemables: {
        data: getAvailablePromotionsResponseObject.promotions,
        has_more: false,
      },
    });

    const list = jest.fn().mockResolvedValue({ schemas: [] });

    service.getClient = jest.fn().mockReturnValue({
      qualifications: {
        checkEligibility,
      },
      metadataSchemas: {
        list,
      },
    });

    await service.getAvailablePromotions(getAvailablePromotionsCart);
    expect(checkEligibility).toBeCalledTimes(1);
    expect(checkEligibility).toBeCalledWith(
      expect.objectContaining({
        scenario: 'PRODUCTS',
        customer: {
          id: '03970ec0-fa17-45d6-a19f-208ee3fcb1a4',
          source_id: '03970ec0-fa17-45d6-a19f-208ee3fcb1a4',
        },
        order: expect.objectContaining({
          source_id: '9e9d98f0-0cf7-4487-95d8-56c1478d7a17',
          amount: 19000,
        }),
        options: {
          limit: 500,
          starting_after: undefined,
          expand: ['redeemable'],
        },
      }),
    );
  });

  it('should check if list was called 1 time', async () => {
    const list = jest.fn().mockResolvedValue({ schemas: [] });

    service.getClient = jest.fn().mockReturnValue({
      metadataSchemas: {
        list,
      },
    });

    await service.getMetadataSchemaProperties('resourceName');
    expect(list).toBeCalledTimes(1);
  });

  it('should check if redeemStackable was called 1 time', async () => {
    const redeemStackable = jest
      .fn()
      .mockResolvedValue(redeemStackableVouchersResponse);

    service.getClient = jest.fn().mockReturnValue({
      redemptions: {
        redeemStackable,
      },
    });

    await service.redeemStackableVouchers(
      redeemStackableVouchersRequest as any,
    );
    expect(redeemStackable).toBeCalledTimes(1);
  });

  it('should check if orders.create was called 1 time, check if order mapping is correct', async () => {
    const create = jest.fn().mockResolvedValue(undefined);

    service.getClient = jest.fn().mockReturnValue({
      orders: {
        create,
      },
    });

    await service.createOrder(
      createOrderOrderObject as any,
      createOrderItems as any,
      {},
    );
    expect(create).toBeCalledTimes(1);
    expect(create).toBeCalledWith(createOrderOrderCreateObject);
  });
});
