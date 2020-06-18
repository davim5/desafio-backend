import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

// import transactionsRouter from '../routes/transactions.routes';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category_title: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category_title,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    // Checando se tem saldo para sacar
    const { total } = await transactionsRepository.getBalance();

    // Caso saque
    if (type === 'outcome' && value > total) {
      throw new AppError('No balance avaiable', 400);
    }

    // Checando se a categoria passada já existe
    let category = await categoriesRepository.findOne({
      where: { title: category_title },
    });
    // Se não existir
    if (!category) {
      category = categoriesRepository.create({
        title: category_title,
      });
      // Criar no Banco
      await categoriesRepository.save(category);
    }

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category_id: category.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
