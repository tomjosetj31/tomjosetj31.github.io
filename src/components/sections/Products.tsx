import { chapters } from '../../content/chapters'
import { products } from '../../content/products'
import { ChapterHeading } from '../ui/ChapterHeading'
import { ProductCard } from '../ui/ProductCard'
import { Reveal } from '../ui/Reveal'

const chapter = chapters[1]

export function Products() {
  return (
    <section id={chapter.id} className="shell scroll-mt-20">
      <ChapterHeading chapter={chapter} />

      <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product, index) => (
          <Reveal
            key={product.slug}
            delay={0.06 * index}
            className={`h-full ${product.featured ? 'md:col-span-2' : ''}`.trim()}
          >
            <ProductCard product={product} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
